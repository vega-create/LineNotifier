import { Template } from "@shared/schema";
import { FormLabel } from "@/components/ui/form";
import { cn } from "@/lib/utils";

type MessageTemplateSelectorProps = {
  templates: Template[];
  selectedTemplate: Template | null;
  onSelectTemplate: (template: Template) => void;
};

export default function MessageTemplateSelector({
  templates,
  selectedTemplate,
  onSelectTemplate,
}: MessageTemplateSelectorProps) {
  // Group templates by type for organization
  const templatesByType: Record<string, Template[]> = templates.reduce(
    (acc, template) => {
      const type = template.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(template);
      return acc;
    },
    {} as Record<string, Template[]>
  );

  const templateTypes = [
    { value: "meeting", label: "會議提醒" },
    { value: "holiday", label: "放假通知" },
    { value: "project", label: "專案進度" },
    { value: "payment", label: "款項通知" },
    { value: "invoice", label: "發票通知" },
    { value: "introduction", label: "自我介紹" },
    { value: "other", label: "其他" },
  ];

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <FormLabel className="block text-sm font-medium text-gray-700">內建訊息模板</FormLabel>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            className={cn(
              "py-2 px-4 rounded-md text-sm transition text-left",
              selectedTemplate?.id === template.id
                ? "bg-blue-100 hover:bg-blue-200 text-blue-800"
                : "bg-gray-100 hover:bg-gray-200 text-gray-800"
            )}
            onClick={() => onSelectTemplate(template)}
          >
            {template.name}
          </button>
        ))}
      </div>
    </div>
  );
}
