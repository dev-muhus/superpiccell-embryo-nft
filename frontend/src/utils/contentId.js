// Normalizes a content id to a decimal string so ids from different sources can be compared.
// Tokens minted before the ethers v6 migration store the JSON form of an ethers v5 BigNumber
// in their on-chain metadata ({ "type": "BigNumber", "hex": "0x01" }), and that data is permanent.
export const normalizeContentId = (id) => BigInt(id?.hex ?? id).toString();
