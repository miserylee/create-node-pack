declare module 'validate-npm-package-name' {
  function validateNpmPackageName(name: string): {
    validForNewPackages: boolean;
    errors?: string[];
    warnings?: string[];
  };

  namespace validateNpmPackageName {
  }
  export = validateNpmPackageName;
}
