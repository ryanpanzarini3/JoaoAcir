const MAX_ESTOQUE = 999999n;

function parseEstoqueValue(value) {
  if (value === undefined || value === null || value === '') {
    throw new Error('quantidadeEstoque é obrigatória');
  }

  const numericValue = typeof value === 'bigint' ? value : BigInt(value);
  if (numericValue < 0n) {
    throw new Error('quantidadeEstoque não pode ser negativa');
  }
  if (numericValue > MAX_ESTOQUE) {
    throw new Error(`quantidadeEstoque não pode ser maior que ${MAX_ESTOQUE}`);
  }
  return numericValue;
}

function clampEstoque(value) {
  const numericValue = typeof value === 'bigint' ? value : BigInt(value);
  if (numericValue < 0n) return 0n;
  if (numericValue > MAX_ESTOQUE) return MAX_ESTOQUE;
  return numericValue;
}

module.exports = {
  MAX_ESTOQUE,
  parseEstoqueValue,
  clampEstoque,
};
