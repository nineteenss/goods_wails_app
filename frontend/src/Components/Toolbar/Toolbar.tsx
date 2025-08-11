import React from "react";
import { Text, Button, Flex, Paper } from "@mantine/core";

export const Toolbar = () => {
  return (
    <Flex direction={"column"} gap={30}>
      <Text size="xl" fw={"600"}>
        Система управления складом
      </Text>
      <Paper withBorder p="xs" radius="lg">
        <Flex gap={"xs"} justify={"space-between"}>
          <Flex gap={"xs"}>
            <Button radius={"md"}>Добавить позицию</Button>
            <Button radius={"md"} variant="outline">
              Обновить
            </Button>
          </Flex>
          <Button radius={"md"} variant="outline">
            Язык
          </Button>
        </Flex>
      </Paper>
    </Flex>
  );
};
