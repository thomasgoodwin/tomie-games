import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GoGrabber } from "react-icons/go";

const SortableItem = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.id });

  const style = {
    margin: ".5rem 0px",
    padding: ".5rem 1.25rem",
    border: "1px solid #D3D3D3",
    borderRadius: '4px',
    display: "flex",
    alignItems: "center",
    gap: ".5rem",
    cursor: "pointer",
    transform: CSS.Transform.toString(transform),
    transition,
    ...props.style
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: "1.25rem",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          textAlign: "left",
        }}
      >
        {props.title}
      </span>

      <GoGrabber style={{ flexShrink: 0 }} />
    </div>
  );
};

export default SortableItem;
