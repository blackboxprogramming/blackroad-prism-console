import { exportUnityProject } from "../server.js";

const main = async () => {
  const result = await exportUnityProject({
    projectName: "SamplePrototype",
    description: "Sample Unity export triggered via npm script.",
    author: "UnityAgent",
    scenes: ["Intro", "Gameplay"],
    notes: "Generated from npm run export:sample.",
    packages: [
      "com.unity.cinemachine@2.9.7",
      { name: "com.unity.timeline", version: "1.8.6" }
    ],
  });

  console.log(JSON.stringify(result, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
