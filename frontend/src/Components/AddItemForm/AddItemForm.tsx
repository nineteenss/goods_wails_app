import { Button, Group, NumberInput, Textarea, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";

type Props = {
  initial?: { name?: string; quantity?: number; comment?: string };
  submitLabel?: string;
  onSubmit: (values: {
    name: string;
    quantity: number;
    comment: string;
  }) => void;
  onCancel: () => void;
};

export function AddItemForm({
  initial,
  submitLabel = "Сохранить",
  onSubmit,
  onCancel,
}: Props) {
  const form = useForm<{ name: string; quantity: number; comment: string }>({
    initialValues: {
      name: initial?.name ?? "",
      quantity: initial?.quantity ?? 0,
      comment: initial?.comment ?? "",
    },
    validate: {
      name: (v: string) => (!v ? "Введите название" : null),
      quantity: (v: number) => (v < 0 ? "Не может быть отрицательным" : null),
    },
  });

  return (
    <form
      onSubmit={form.onSubmit(
        (values: { name: string; quantity: number; comment: string }) => {
          onSubmit(values);
        }
      )}
    >
      <TextInput
        label="Название"
        placeholder="Например, Товар"
        {...form.getInputProps("name")}
      />
      <NumberInput
        mt="sm"
        label="Количество"
        min={0}
        {...form.getInputProps("quantity")}
      />
      <Textarea
        mt="sm"
        label="Комментарий"
        autosize
        minRows={2}
        {...form.getInputProps("comment")}
      />
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onCancel} type="button">
          Отмена
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </Group>
    </form>
  );
}
