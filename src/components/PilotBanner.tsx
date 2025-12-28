const PilotBanner = () => {
  return (
    <div className="w-full p-3 bg-primary/10 border border-primary/20 rounded-lg text-center">
      <p className="text-sm text-primary font-medium">Pilot Mode</p>
      <p className="text-xs text-muted-foreground mt-1">
        You're part of an early access group helping us shape FYNXX. Some features are still being refined.
      </p>
    </div>
  );
};

export default PilotBanner;
