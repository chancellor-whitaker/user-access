import useVirtual from "react-cool-virtual";

export default function VirtualList({ children = [], ...props }) {
  const itemCount = children.length;

  const { outerRef, innerRef, items } = useVirtual({ itemCount });

  const childrenItems = items.map(({ measureRef, index }) => (
    // Use the `measureRef` to measure the item size
    <div ref={measureRef} key={index}>
      {children[index]}
    </div>
  ));

  return (
    <div ref={outerRef} {...props}>
      <div ref={innerRef}>{childrenItems}</div>
    </div>
  );
}
