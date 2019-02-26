const FakeChromeExtensionId = 'fakeabc123';


export function fakeSender(tabId: number, chromeExtensionId?: string) {
  return {
    id: chromeExtensionId || FakeChromeExtensionId,
    tab: {
      id: tabId
    }
  }
}

export {
  FakeChromeExtensionId
};
