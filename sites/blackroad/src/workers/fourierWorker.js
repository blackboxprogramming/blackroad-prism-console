/* eslint-env worker */
/* global addEventListener, postMessage */
import { dft2 } from "../lib/fourier.js";

addEventListener("message", ({ data }) => {
  const { A, id } = data || {};
  if (!A) return;
  const F = dft2(A);
  postMessage({ id, F });
});
