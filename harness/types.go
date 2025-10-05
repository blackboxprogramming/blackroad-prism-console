package harness

import "maps"

// Event represents a policy evaluation input payload.
type Event = map[string]any

// NormalizeEvent creates a shallow copy of the event ensuring the returned map
// cannot be mutated by callers while the harness is iterating over window snapshots.
func NormalizeEvent(ev Event) Event {
	if ev == nil {
		return map[string]any{}
	}
	out := make(map[string]any, len(ev))
	for k, v := range ev {
		out[k] = v
	}
	return out
}

// CloneEvents copies the provided slice of events, normalising each element.
func CloneEvents(in []Event) []Event {
	if len(in) == 0 {
		return nil
	}
	out := make([]Event, len(in))
	for i, ev := range in {
		out[i] = NormalizeEvent(ev)
	}
	return out
}

// mergeDetails merges arbitrary maps into dst, allocating if required. Later
// maps overwrite earlier keys.
func mergeDetails(dst map[string]any, mapsToMerge ...map[string]any) map[string]any {
	if dst == nil {
		dst = make(map[string]any)
	}
	for _, m := range mapsToMerge {
		if len(m) == 0 {
			continue
		}
		for k, v := range m {
			dst[k] = v
		}
	}
	return dst
}

// copyStringMap creates a shallow copy of a map used for metadata/labels.
func copyStringMap(in map[string]string) map[string]string {
	if len(in) == 0 {
		return nil
	}
	out := make(map[string]string, len(in))
	maps.Copy(out, in)
	return out
}
