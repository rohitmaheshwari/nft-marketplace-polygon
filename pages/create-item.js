import { useState } from 'react';
import { ethers } from 'ethers';
import { create, create as ipfsHttpClient } from 'ipfs-http-client';
import { useRouter } from 'next/router';
import Web3Modal from 'web3modal';

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');

import { nftaddress, nftmarketaddress } from "../.config";
import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

export default function CreateItem() {
    const [fileUrl, setFileUrl] = useState(null);
    const [formInput, setFormInput] = useState({ price: "", name: "", description: "" });
    const router = useRouter();

    async function onChange(e) {
        const file = e.target.files[0];
        try {
            const added = await client.add(file, { progress: (prog) => console.log(`received: ${prog}`) });

            const url = `https://ipfs.infura.io/ipfs/${added.path}`;

            setFileUrl(url);
        } catch (error) {
            console.log(error);
        }
    }

    async function createItem() {
        const { name, description, price } = formInput;
        if (!price || !description || !name || !fileUrl) return;
        const data = JSON.stringify({
            name, description, price, image: fileUrl
        });

        try {
            const added = await client.add(data);

            const url = `https: ipfs.infura.io/ipfs/${added.path} `;
            createSale(url);
        } catch (error) {
            console.log(error);
        }
    }

    async function createSale(url) {
        const web3modal = new Web3Modal();
        const connection = await web3modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        let contract = new ethers.Contract(nftaddress, NFT.abi, signer);
        let transaction = await contract.createToken(url);
        let tx = await transaction.wait();

        console.log(tx);
        let event = tx.events[0];
        console.log(tx.events);
        let value = event.args[2];
        let tokenId = value.toNumber();

        const price = ethers.utils.parseUnits(formInput.price, 'ether');

        contract = new ethers.Contract(nftmarketaddress, Market.abi, signer);
        let listingPrice = await contract.getListingPrice();
        listingPrice = listingPrice.toString();
        console.log(nftaddress);
        console.log(tokenId);
        console.log(price);
        console.log(listingPrice);

        // let event = tx.events[0];
        // console.log(tx.events);
        // let value = event.args[2];
        // let tokenId = value.toNumber();

        transaction = await contract.createMarketItem(nftaddress, tokenId, price, { value: listingPrice });
        await transaction.wait(); l

        router.push('/');
    }

    return (
        <div className='flex justify-center'>
            <div className='w-1/2 flex flex-col pb-12'>
                <input
                    placeholder="Asset Name"
                    className='mt-8 border rounded p-4'
                    onChange={(e) => setFormInput({ ...formInput, name: e.target.value })}
                />
                <textarea
                    placeholder='Asset Description'
                    className='mt-2 border rounded p-4'
                    onChange={(e) => setFormInput({ ...formInput, description: e.target.value })}
                />
                <input
                    placeholder="Asset Price in MATIC"
                    className='mt-8 border rounded p-4'
                    onChange={(e) => setFormInput({ ...formInput, price: e.target.value })}
                />
                <input
                    type="file"
                    name="Asset"
                    className='my-4'
                    onChange={onChange}
                />
                {
                    fileUrl && (
                        <img className='rounded mt-4' width="350" src={fileUrl} />
                    )
                }
                <button
                    className='font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg'
                    onClick={createItem}>Create Digital Asset</button>
            </div>
        </div>
    );

}