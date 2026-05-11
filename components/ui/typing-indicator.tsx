export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-10 items-center gap-1.5 rounded-2xl rounded-bl-sm bg-muted px-4 shadow-sm">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block h-2.5 w-2.5 rounded-full bg-muted-foreground/60 animate-typing-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
