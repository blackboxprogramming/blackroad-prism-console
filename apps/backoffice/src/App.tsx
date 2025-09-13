// …keep existing…
import Audit from './pages/Audit';
export default function App(){
  // …existing state/effects…
  return <div style={{fontFamily:'system-ui', padding:16}}>
    <h1>BlackRoad Backoffice</h1>
    <nav style={{marginBottom:12}}>
      <a href="#audit" onClick={(e)=>{e.preventDefault(); document.getElementById('audit')?.scrollIntoView();}}>Audit</a>
    </nav>
    <h2>API Keys</h2>
    <KeyTable rows={keys}/>
    <h2>Webhooks</h2>
    <WebhookTable rows={hooks}/>
    <section id="audit"><Audit/></section>
  </div>;
}
