import { List, Menu, Portal, Button, ColorSwatch } from "@chakra-ui/react";
import { LuCircleCheck, LuCircleSlash2 } from "react-icons/lu";

const PlayerList = ({ players, setPlayerList }) => {
  let playerCount = Object.keys(players).length;
  return <div style={{ width: "100%", justifyContent: "center", display: "flex" }}>
    {playerCount > 0 && <div className="player-list" style={{ display: "flex", justifyContent: "center" }}>
      <List.Root gap="2" variant="plain" align="center">
        {Object.keys(players).map((name, i) => {
          const hasDuplicate = Object.keys(players).indexOf(name) !== i;
          return <List.Item className="player-list-item">
            <div style={{ display: "flex", alignItems: "center", marginRight: '.5rem' }}>
              <List.Indicator asChild color={hasDuplicate ? "red.500" : "green.500"}>
                {hasDuplicate ? <LuCircleSlash2 /> : <LuCircleCheck />}
              </List.Indicator>
              {name}
            </div>
            <div>
              <Menu.Root onSelect={(e) => {
                let copy = structuredClone(players);
                copy[name].color = e.value;
                setPlayerList(copy);
              }}>
                <Menu.Trigger asChild>
                  <Button variant="outline" size="sm">
                    Color <ColorSwatch value={players[name].color ?? "black"} />
                  </Button>
                </Menu.Trigger>
                <Portal>
                  <Menu.Positioner>
                    <Menu.Content>
                      <Menu.Item value="#FF3131">
                        <ColorSwatch value={"#FF3131"} />Red
                      </Menu.Item>
                      <Menu.Item value="#002fa7">
                        <ColorSwatch value={"#002fa7"} />Blue
                      </Menu.Item>
                      <Menu.Item value="#FFF01F">
                        <ColorSwatch value={"#FFF01F "} />Yellow
                      </Menu.Item>
                      <Menu.Item value="white">
                        <ColorSwatch value={"white"} />White
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
            </div>
          </List.Item>
        })}
      </List.Root>
    </div>}
    {playerCount === 0 && <div>
      No Current Players
    </div>}
  </div>
}

export default PlayerList;