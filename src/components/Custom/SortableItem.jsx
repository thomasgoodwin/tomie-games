import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GoGrabber } from "react-icons/go";
import { Button } from '@chakra-ui/react';
import { GiCancel } from "react-icons/gi";

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
    padding: ".5rem .25rem .5rem .25rem",
    border: "1px solid #D3D3D3",
    borderRadius: '4px',
    display: "flex",
    alignItems: "center",
    gap: ".5rem",
    zIndex: 10,

    transform: CSS.Transform.toString(transform),
    transition,
    ...props.style
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}

    >
      <GoGrabber style={{ flexShrink: 0 }} size={30} {...listeners} cursor={"pointer"} />
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
      <Button
        colorPalette="red"
        size="xs"
        onClick={async () => {
          console.log('test', props.apiUrl + "/songs/" + props.id)
          const response = await fetch(props.apiUrl + "/songs/" + props.id, {
            method: "DELETE",
            headers: {
              'X-Queue-Secret': props.secret
            }
          });
          console.log(response)
          if (!response.ok) {
            console.error("Failed to delete song from queue.")
          }
        }}
      >
        <GiCancel size={40} color='white' />
      </Button>
    </div>
  );
};

export default SortableItem;
