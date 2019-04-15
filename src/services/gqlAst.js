export function getOperationName(operation) {
  const def = operation.definitions[0]
  return { name: def.name.value, operationName: def.selectionSet.selections[0].name.value }
}
