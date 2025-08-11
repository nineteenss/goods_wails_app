import { Text, Flex, Paper } from "@mantine/core";
import { AddItemButton } from "../Buttons/AddItemButton";

export const Toolbar = () => {
  return (
    <Flex direction={"column"} gap={30}>
      <Text size="xl" fw={"600"}>
        Система управления складом
      </Text>
    </Flex>
  );
};
