import { useSequencerStore } from './src/store/useSequencerStore';
const store = useSequencerStore.getState();
console.log('Before:', store.pattern.tracks.filter(t => t.type === 'drum').map(t => t.steps.filter(s => s.active).length));
store.applyRhythmPreset('disco');
const storeAfter = useSequencerStore.getState();
console.log('After disco:', storeAfter.pattern.tracks.filter(t => t.type === 'drum').map(t => t.steps.filter(s => s.active).length));
store.applyRhythmPreset('waltz');
const storeAfterWaltz = useSequencerStore.getState();
console.log('After waltz:', storeAfterWaltz.pattern.tracks.filter(t => t.type === 'drum').map(t => t.steps.filter(s => s.active).length));
