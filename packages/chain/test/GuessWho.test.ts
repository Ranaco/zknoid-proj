import { AppChain, TestingAppChain } from '@proto-kit/sdk';
import { Field, Int64, PrivateKey, PublicKey, UInt64 } from 'o1js';
import { log } from '@proto-kit/common';
import { Pickles } from 'o1js/dist/node/snarky';
import { dummyBase64Proof } from 'o1js/dist/node/lib/proof-system/zkprogram';
import { GuessWhoGame } from '../src';
import { Balances } from '@proto-kit/library';

log.setLevel("TRACE")

export async function mockProof<I, O, P>(
    publicOutput: O,
    ProofType: new ({
        proof,
        publicInput,
        publicOutput,
        maxProofsVerified,
    }: {
        proof: unknown;
        publicInput: I;
        publicOutput: any;
        maxProofsVerified: 0 | 2 | 1;
    }) => P,
    publicInput: I,
): Promise<P> {
    const [proof] = Pickles.proofOfBase64(await dummyBase64Proof(), 2);
    return new ProofType({
        proof: proof,
        maxProofsVerified: 2,
        publicInput,
        publicOutput,
    });
}

describe("Guess Who Chain Test", () => {
    it.skip('Log proof', async () => {
        console.log(await dummyBase64Proof());
    });

    it("Two players basic case", async () => {
        const appChain = TestingAppChain.fromRuntime({
            GuessWhoGame,
            Balances,
        });

        appChain.configurePartial({
            Runtime: {
                GuessWhoGame: {},
                Balances: { totalSupply: UInt64.from(1000000000000000000) },
            },
        });

        const alicePrivateKey = PrivateKey.random();
        const alice = alicePrivateKey.toPublicKey();

        const bobPrivateKey = PrivateKey.random();
        const bob = bobPrivateKey.toPublicKey();

        await appChain.start();

        const randzu = appChain.runtime.resolve('GuessWhoGame');

        console.log('Finding match');
        {
            appChain.setSigner(alicePrivateKey);
            const tx1 = await appChain.transaction(alice, async () => {
                randzu.register(alice, UInt64.zero);
            });
            await tx1.sign();
            await tx1.send();

            let block = await appChain.produceBlock();
            expect(block?.transactions[0].status.toBoolean()).toBeTruthy();

            appChain.setSigner(bobPrivateKey);
            const tx2 = await appChain.transaction(bob, async () => {
                randzu.register(bob, UInt64.zero);
            });
            await tx2.sign();
            await tx2.send();

            block = await appChain.produceBlock();
            expect(block?.transactions[0].status.toBoolean()).toBeTruthy();

            let aliceGameId =
                await appChain.query.runtime.GuessWhoGame.activeGameId.get(alice);
            let bobGameId =
                await appChain.query.runtime.GuessWhoGame.activeGameId.get(bob);

            console.log(aliceGameId?.toString());
            expect(aliceGameId!.equals(bobGameId!)).toBeTruthy();
        }
    }, 100000)
})