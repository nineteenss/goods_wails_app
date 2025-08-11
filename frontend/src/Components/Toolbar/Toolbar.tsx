import React from "react";
import { Text, Button, Flex, Paper } from "@mantine/core";
import { modals } from "@mantine/modals";
import { AddItemForm } from "../AddItemForm/AddItemForm";
import { createItem } from "../../utils/api";

export const Toolbar = () => {
  return (
    <Flex direction={"column"} gap={30}>
      <Text size="xl" fw={"600"}>
        Система управления складом
      </Text>
      <Paper withBorder p="xs" radius="lg">
        <Flex gap={"xs"} justify={"space-between"}>
          <Flex gap={"xs"}>
            <Button
              radius={"md"}
              onClick={() => {
                modals.open({
                  title: "Добавить позицию",
                  children: (
                    <AddItemForm
                      submitLabel="Добавить"
                      onCancel={() => modals.closeAll()}
                      onSubmit={async (values) => {
                        await createItem(values);
                        modals.closeAll();
                      }}
                    />
                  ),
                  centered: true,
                });
              }}
            >
              Добавить позицию
            </Button>
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
