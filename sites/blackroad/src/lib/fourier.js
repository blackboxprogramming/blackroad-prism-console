export function dft2(A){
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
