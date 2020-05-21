
function sum(a, b) {
  if (!Number.isInteger(a) && !Number.isInteger(b)) {
    throw new TypeError('Ошибка');
  }

  return a + b;
}

module.exports = sum;
