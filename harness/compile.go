package harness

func CompileFromYAML(path string, store *WindowStore) (CompiledRule, error) {
	spec, err := LoadRuleYAML(path)
	if err != nil {
		return CompiledRule{}, err
	}

	env, progOpts, err := EnvWithBuiltins(store)
	if err != nil {
		return CompiledRule{}, err
	}

	compiled, err := spec.compileWithEnv(env, progOpts, store)
	if err != nil {
		return CompiledRule{}, err
	}

	return compiled, nil
}

func CompileMirror() (CompiledRule, error) {
	store := NewWindowStore(4096)
	return CompileFromYAML("rules/mirror_class_limit.yaml", store)
}
