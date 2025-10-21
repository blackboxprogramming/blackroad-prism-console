/* eslint-env worker */
/* global self, postMessage */
self.onmessage = e => {
  const {N, ap, param} = e.data;
  const A = makeAperture(N, ap, param);
  const F = dft2(A);
  postMessage(F);
};

function makeAperture(N, ap, p){
  const A = Array.from({length:N},()=>Array(N).fill(0));
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    const X=(x+0.5)/N-0.5, Y=(y+0.5)/N-0.5;
    let v=0;
    if(ap==="circle") v=(Math.hypot(X,Y)<=p)?1:0;
    else if(ap==="slit") v=(Math.abs(X)<=p*0.2)?1:0;
    else if(ap==="rect") v=(Math.abs(X)<=p && Math.abs(Y)<=p*0.6)?1:0;
    else if(ap==="checker"){ const s=p*4; v=((Math.floor((X+0.5)/s)+Math.floor((Y+0.5)/s))%2===0)?1:0; }
    A[y][x]=v;
  }
  return A;
}

function dft2(A){
  const N=A.length, M=A[0].length;
  const mag=Array.from({length:N},()=>Array(M).fill(0));
  for(let u=0;u<N;u++){
    for(let v=0;v<M;v++){
      let re=0, im=0;
      for(let y=0;y<N;y++) for(let x=0;x<M;x++){
        const ang=-2*Math.PI*(u*x/N + v*y/M);
        const c=Math.cos(ang), s=Math.sin(ang);
        re += A[y][x]*c; im += A[y][x]*s;
      }
      const m = re*re + im*im;
      mag[u][v]=m;
    }
  }
  const B=Array.from({length:N},()=>Array(M).fill(0));
  let mx=0; for(let u=0;u<N;u++) for(let v=0;v<M;v++) mx=Math.max(mx,mag[u][v]);
  for(let u=0;u<N;u++) for(let v=0;v<M;v++){
    const us=(u+N/2|0)%N, vs=(v+M/2|0)%M;
    B[us][vs]=Math.log(1+mag[u][v]/(mx+1e-9));
  }
  return B;
}
