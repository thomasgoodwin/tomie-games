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
    margin: ".35rem 0px",
    padding: ".6rem .5rem .6rem .25rem",
    border: "1px solid rgba(6, 182, 212, 0.3)",
    borderLeft: "3px solid #06B6D4",
    borderRadius: '6px',
    background: "rgba(6, 182, 212, 0.06)",
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
      <GoGrabber style={{ flexShrink: 0, color: "#06B6D4" }} size={30} {...listeners} cursor={"pointer"} />
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
          if (props.demoMode) {
            props.onDelete(props.id);
            return;
          }
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
