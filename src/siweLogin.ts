import { BrowserProvider, type Eip1193Provider } from 'ethers';
import { SiweMessage } from 'siwe';
import { siweNonce, siweVerify, type Tokens } from './authApi';
import { SIWE_DOMAIN, SIWE_URI } from './config';

const SEPOLIA_CHAIN_ID = 11155111;

export async function siweSignIn(): Promise<Tokens> {
  const eth = (window as { ethereum?: Eip1193Provider }).ethereum;
  if (!eth) throw new Error('MetaMask not found. Please install it.');

  const provider = new BrowserProvider(eth);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  const { nonce } = await siweNonce();

  const message = new SiweMessage({
    domain: SIWE_DOMAIN,
    address,
    statement: 'Sign in to ShopHub to manage your shops.',
    uri: SIWE_URI,
    version: '1',
    chainId: SEPOLIA_CHAIN_ID,
    nonce,
  });

  const prepared = message.prepareMessage();
  const signature = await signer.signMessage(prepared);

  return siweVerify(prepared, signature);
}
