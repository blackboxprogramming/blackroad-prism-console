async function load(id, dataset){
  try{
    const res = await fetch(`/api/bi/dataset/${dataset}`);
    if(!res.ok) throw new Error('404');
    const data = await res.json();
    document.getElementById(id).textContent = JSON.stringify(data, null, 2);
  }catch{ document.getElementById(id).textContent = 'No data'; }
}
