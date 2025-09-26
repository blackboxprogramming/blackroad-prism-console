import { File } from '../app/hooks/useSessionManager';

interface AbilityPayload {
  ability: string;
  content: string;
}

export const runAbility = async (
  payload: AbilityPayload
): Promise<{ file?: File; output?: string }> => {
  const { ability, content } = payload;

  switch (ability) {
    case 'codestream.generateFile':
      return {
        file: {
          name: 'main.py',
          type: 'code',
          content: content,
        },
      };

    case 'visioncraft.generateImage':
      return {
        file: {
          name: 'generated-image.png',
          type: 'image',
          content: '[base64 image or URL]',
        },
      };

    case 'thoughtmirror.reflect':
      return {
        output: `“${content}” — a thought worth keeping. Saved to memory.`,
      };

    default:
      return {
        output: `Lucidia whispered something unclear: ${content}`,
      };
  }
};

