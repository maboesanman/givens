
function allProps(object: any): string[] {
  const myProps = Object.getOwnPropertyNames(object);
  const proto = Object.getPrototypeOf(object);
  const parentProps = proto ? allProps(proto) : [];
  return [...myProps, ...parentProps];
}

const disallowedProps = [
  // props created by this library
  '__props__',
  '__cache__',
  '__trace__',
  // prototype props
  ...allProps(
    // this is a noop function so the contents do not need to be covered
    /* istanbul ignore next */
    () => undefined,
  ),
];

const isValid = (key: string): boolean => !disallowedProps.includes(key);

export default isValid;
