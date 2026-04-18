import { Input } from "@/components/ui/input";

export default function Search() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-xl text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Ask me anything
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Search coming soon
          </p>
        </div>
        <Input
          disabled
          placeholder="Type your question…"
          className="h-12 text-base"
        />
      </div>
    </div>
  );
}
