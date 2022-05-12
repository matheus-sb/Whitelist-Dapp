import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import styles from '../styles/Home.module.css'
import Web3Modal from 'web3modal';
import { Contract, providers } from 'ethers';
import { abi, WHITELIST_CONTRACT_ADDRESS } from '../constants';

export default function Home() {

  const [walletConnected, setWalletConnected] = useState(false);

  const [joinedWhitelist, setJoinedWhitelist] = useState(false);

  const [loading, setLoading] = useState(false);

  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);  

  const web3ModalRef = useRef();

  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    // If user is not connected to the Rinkeby network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();

    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change the network to Rinkeby");
    }

    if (needSigner) {
      return web3Provider.getSigner();
    }

    return web3Provider;
  }

  const checkIfAddressInWhitelist = async () => {
    try {
      // We will need the signer later to get the user's address
      // Even though it is a read transaction, since Signers are just special kinds of Providers,
      // We can use it in it's place
      const signer = await getProviderOrSigner(true);

      const whiteListContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // Get the address associated to the signer which is connected to  MetaMask
      const address = await signer.getAddress();
      // call the whitelistedAddresses from the contract
      const _joinedWhitelist = await whiteListContract.whiteListedAddresses(address);

      setJoinedWhitelist(_joinedWhitelist);
    } catch (error) {
      console.error(error);
    }
  }

  const getNumberOfWhitelisted = async () => {
    try {
      const provider = await getProviderOrSigner();

      const whiteListContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        provider
      );

      const _numberOfWhitelisted = await whiteListContract.numWhiteListedAddresses();
      
      setNumberOfWhitelisted(_numberOfWhitelisted);
    } catch (error) {
      console.error(error);
    }
  }

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();

      setWalletConnected(true);
      checkIfAddressInWhitelist();
      getNumberOfWhitelisted();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (walletConnected) {
      return;
    }

    web3ModalRef.current = new Web3Modal({
      network: 'rinkeby',
      providerOptions: {},
      disableInjectedProvider: false
    });

    connectWallet();
  }, [walletConnected]);

  const addAddressToWhitelist = async () => {

    try {
      // We need a Signer here since this is a 'write' transaction.
      const signer = await getProviderOrSigner(true);
      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const whiteListContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );
  
      // call the addAddressToWhitelist from the contract
      const tx = await whiteListContract.addAddressToWhiteList();

      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);

      // get the updated number of addresses in the whitelist
      await getNumberOfWhitelisted();
      setJoinedWhitelist(true);
    } catch (error) {
      console.error(error);
    }
  }

  const renderButton = () => {
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    if (joinedWhitelist) {
      return (
        <div className={styles.description}>
          Thanks for joining the Whitelist!
        </div>
      );
    }

    if (loading) {
      return (
        <button className={styles.button}>Loading...</button>
      );
    }

    return (
      <button onClick={addAddressToWhitelist} className={styles.button}>
        Join the Whitelist
      </button>
    );
  };

  return (
    <div>
      <Head>
        <title>Whitelist Dapp</title>
        <meta name="description" content="Whitelist Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to crypto devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto
          </div>
          <div className={styles.description}>
            {numberOfWhitelisted} have already joined the Whitelist!
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./crypto-devs.svg"/>
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  )
}
