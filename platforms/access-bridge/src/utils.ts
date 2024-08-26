export function isValidSiteId(siteId: string): boolean {
  // Regular expression to match exactly 8 alphanumeric characters
  const alphanumericRegex = /^[a-zA-Z0-9]{8}$/;
  return alphanumericRegex.test(siteId);
}

/**
 * Checks if the required parameters are present in the provided object.
 * @param params - The object containing the parameters to be validated.
 * @param requiredParams - The list of required keys to check for presence.
 * @returns An array of missing required keys.
 */
export const validateBodyParams = <T>(params: Partial<T>, requiredParams: (keyof T)[]): (keyof T)[] => {
  // Filter out keys that are required but missing or undefined
  const missingParams = requiredParams.filter(
    (key) => !(key in params) || params[key] === undefined || params[key] === ''
  );

  return missingParams;
};
