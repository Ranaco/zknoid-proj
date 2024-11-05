import { AuroSigner, ClientAppChain } from "@proto-kit/sdk";
import runtime from "../runtime";

const appChain = ClientAppChain.fromRuntime(runtime.modules, AuroSigner);

appChain.configurePartial({
  Runtime: runtime.config,
});

appChain.configurePartial({
  GraphqlClient: {
    url: process.env.NEXT_PUBLIC_PROTOKIT_GRAPHQL_URL,
  },
});

console.log("This is the appChain client", appChain)

export const client = appChain;