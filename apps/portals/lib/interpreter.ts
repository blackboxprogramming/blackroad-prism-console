export interface ParsedAbility {
  ability: string;
  content: string;
}

export function parseAgentOutput(raw: string): ParsedAbility {
  const match = raw.match(/<ability:(.*?)>(.*?)<\/ability>/s);

  if (match) {
    return {
      ability: match[1].trim(),
      content: match[2].trim(),
    };
  }

  return {
    ability: 'generic.chat',
    content: raw.trim(),
  };
}

