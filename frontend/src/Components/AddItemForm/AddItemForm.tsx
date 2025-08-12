import { Button, Group, NumberInput, TextInput, Pill } from "@mantine/core";
import { useForm } from "@mantine/form";

import styles from "./AddItemForm.module.css";

type Props = {
  initial?: { name?: string; quantity?: number };
  submitLabel?: string;
  onSubmit: (values: { name: string; quantity: number }) => void;
  onCancel: () => void;
  maxQuantity?: number;
  mode?: "create" | "update" | "withdraw" | "add";
};

export function AddItemForm({
  initial,
  submitLabel = "Сохранить",
  onSubmit,
  onCancel,
  maxQuantity,
  mode,
}: Props) {
  const form = useForm<{ name: string; quantity: number }>({
    initialValues: {
      name: initial?.name ?? "",
      quantity: initial?.quantity ?? 0,
    },
    validate: {
      name: (v: string) => (!v ? "Введите название" : null),
      quantity: (v: number) => {
        if (v < 0) return "Не может быть отрицательным";
        if (mode === "withdraw") {
          if (v <= 0) return "Должно быть больше 0";
          if (typeof maxQuantity === "number" && v > maxQuantity)
            return `Нельзя списать больше, чем доступно: ${maxQuantity}`;
        }
        return null;
      },
    },
    validateInputOnChange: true,
  });

  return (
    <form
      onSubmit={form.onSubmit((values: { name: string; quantity: number }) => {
        onSubmit(values);
      })}
    >
      <TextInput
        label="Название"
        placeholder="Например: Резистор"
        disabled={mode === "withdraw" || mode === "add"}
        {...form.getInputProps("name")}
      />
      {mode !== "update" && (
        <NumberInput
          mt="sm"
          label="Количество"
          min={mode === "withdraw" || mode === "add" ? 1 : 0}
          max={
            mode === "withdraw" && typeof maxQuantity === "number"
              ? maxQuantity
              : undefined
          }
          clampBehavior={
            mode === "withdraw" || mode === "add" ? "strict" : "blur"
          }
          description={
            mode === "withdraw" && typeof maxQuantity === "number" ? (
              <Pill bg={"orange.1"} variant="outline">
                В наличии: {maxQuantity}
              </Pill>
            ) : undefined
          }
          classNames={{
            root: styles.root,
            description: styles.description,
          }}
          {...form.getInputProps("quantity")}
        />
      )}

      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onCancel} type="button">
          Отмена
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </Group>
    </form>
  );
}
