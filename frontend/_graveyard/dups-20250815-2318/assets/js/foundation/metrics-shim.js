/**
 * Safe Metrics shim.
 * If your real metrics module is present, this won't override it.
 * If not, it defines the minimal functions the UI calls.
 */
(function(){
  const q = [];
  function enqueue(evt){ q.push(evt); /* optionally flush later */ }

  // Don't clobber if already defined
  const M = (window.Metrics = window.Metrics || {});
  M.track = M.track || ((name, props={}) =>
    enqueue({ t:name, p:props, ts:Date.now() })
  );
  M.trackInstallPromptShown    = M.trackInstallPromptShown    || ((props={}) => M.track('install_prompt_shown', props));
  M.trackInstallPromptAccepted = M.trackInstallPromptAccepted || ((props={}) => M.track('install_prompt_accepted', props));
  M.trackRoute                 = M.trackRoute                 || ((route)    => M.track('route_change', { route }));
})();