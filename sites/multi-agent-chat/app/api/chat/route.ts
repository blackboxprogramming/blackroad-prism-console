import { NextRequest, NextResponse } from 'next/server';

interface Message {
  author: string;
  content: string;
}

const personas = ['Lucidia', 'Cecilia', 'Silas', 'Alexa'];
const conversation: Message[] = [];

function personaReply(name: string, userMessage: string): string {
  switch (name) {
    case 'Lucidia':
      return `Illuminated thought regarding "${userMessage}".`;
    case 'Cecilia':
      return `Cecilia reflects: "${userMessage}"? Intriguing.`;
    case 'Silas':
      return `Silas computes a view on "${userMessage}".`;
    case 'Alexa':
      return `Alexa responds cheerfully about "${userMessage}".`;
    default:
      return `${name} has no response.`;
  }
}

export async function GET() {
  return NextResponse.json({ messages: conversation });
}

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  const userMsg: Message = { author: 'User', content: message };
  conversation.push(userMsg);

  personas.forEach(name => {
    const reply = personaReply(name, message);
    conversation.push({ author: name, content: reply });
  });

  return NextResponse.json({ messages: conversation });
}
