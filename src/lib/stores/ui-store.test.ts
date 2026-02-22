import { useUiStore } from '@/lib/stores/ui-store';

describe('uiStore', () => {
  afterEach(() => {
    useUiStore.setState({
      isSidebarCollapsed: false,
      isCommandPaletteOpen: false,
      theme: 'system',
    });
  });

  it('should toggle sidebar and command palette', () => {
    useUiStore.getState().toggleSidebar();
    useUiStore.getState().setCommandPaletteOpen(true);

    expect(useUiStore.getState().isSidebarCollapsed).toBe(true);
    expect(useUiStore.getState().isCommandPaletteOpen).toBe(true);
  });
});
