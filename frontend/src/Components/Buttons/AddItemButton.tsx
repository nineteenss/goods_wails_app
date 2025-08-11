import React from "react";

import { Button } from "@mantine/core";
import { modals } from "@mantine/modals";
import { AddItemForm } from "../AddItemForm/AddItemForm";
import { createItem } from "../../utils/api";
import { IconPlus } from "@tabler/icons-react";

export const AddItemButton = () => {
  return (
    <Button
      radius={"md"}
      miw={"fit-content"}
      onClick={() => {
        modals.open({
          title: "Добавить позицию",
          children: (
            <AddItemForm
              submitLabel="Добавить"
              onCancel={() => modals.closeAll()}
              onSubmit={async (values) => {
                await createItem({ ...values, comment: "" });
                modals.closeAll();
              }}
            />
          ),
          centered: true,
          radius: "12px",
        });
      }}
      leftSection={<IconPlus size={18} />}
    >
      Добавить позицию
    </Button>
  );
};
