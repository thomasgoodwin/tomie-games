import { List } from "@chakra-ui/react";
import { LuCircleCheck, LuCircleSlash2 } from "react-icons/lu";

const PlayerList = ({ players }) => {
  return <div>
    <List.Root gap="2" variant="plain" align="center" width={"50%"}>
      {players.map((player, i) => {
        const hasDuplicate = players.indexOf(player) !== i;
        return <List.Item>
          <List.Indicator asChild color={hasDuplicate ? "red.500" : "green.500"}>
            {hasDuplicate ? <LuCircleSlash2 /> : <LuCircleCheck />}
          </List.Indicator>
          {player}
        </List.Item>
      })}
    </List.Root>
    {players.length === 0 && <div>
      No Current Players
    </div>}
  </div>
}

export default PlayerList;