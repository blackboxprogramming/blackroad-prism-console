function createScalarField(width, height, fill = 0) {
  const data = new Float64Array(width * height);
  if (fill !== 0) {
    data.fill(fill);
  }
  return { width, height, data };
}

function cloneField(field) {
  return {
    width: field.width,
    height: field.height,
    data: new Float64Array(field.data),
  };
}

module.exports = {
  createScalarField,
  cloneField,
};
