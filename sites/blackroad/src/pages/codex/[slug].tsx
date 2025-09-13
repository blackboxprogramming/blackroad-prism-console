import { useParams } from 'react-router-dom';
import CodexPrompt from '../../ui/CodexPrompt';

export default function CodexSlug() {
  const { slug } = useParams();
  return <CodexPrompt id={slug as string} />;
}
