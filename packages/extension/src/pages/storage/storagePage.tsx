import { createEffect, createResource, createSignal, For, JSX, Setter, Show } from "solid-js";
import { render } from "solid-js/web";

import "./storage.css";
import {
  changeActiveStorage,
  createStorageOption,
  deleteStorageOption,
  getActiveStorage,
  getFromStorage,
  getStorageOptions,
  listenToStorage,
  setToStorage,
} from "../../utils/storage";
import { ACTIVE_STORAGE, connectToMetamask, ID_KEY, Storage, STORAGE_OPTIONS } from "../../utils/utils";
import { isStorageAvailable, ping } from "../../utils/backend";

function StorageElement(props: {
  option: Storage,
  isActive: () => boolean,
  storageType: string,
  setOptions: Setter<Storage[] | undefined>,
  refetchActiveStorage: (info?: unknown) => (Storage | undefined) | Promise<Storage | undefined> | undefined | null,
}) {
  const isActive = props.isActive;
  console.log(props);
  const option = props.option;
  const setOptions = props.setOptions;
  const refetchActiveStorage = props.refetchActiveStorage;
  const storageType = props.storageType;
  console.log("option: ", option);
  console.log("isActive: ", isActive());
  console.log("storageType", storageType);


  async function deleteOption() {

    await deleteStorageOption(option?.url || '', storageType);

    //@ts-ignore
    setOptions((op: Storage[]) => (op.filter(
      (x) => x.url !== option?.url
    )));
  }

  async function makeMain() {
    let id: string = await getFromStorage(ID_KEY);
    if (!id) {
      try {
        const signer = await connectToMetamask()
        id = await signer.getAddress();
        await setToStorage(ID_KEY, id);
      } catch (err) {
        console.log(err);
      }
    }

    await changeActiveStorage(option?.url || '', storageType, true);
    refetchActiveStorage();
  }

  return (
    <li id={option?.url + '-root'}>
      <div class="article-header">
        <h2>{option?.alias}</h2>
      </div>
      <p>
        {option?.url}
      </p>
      <div>
        <Show when={isActive()}>
          <span class="isActive">Currently Active</span>
        </Show>
      </div>
      <Show when={!isActive()}>
        <button
          title="click to make active"
          aria-label="click to make active"
          id={option?.url + "--makeActive"}
          class="main"
          onClick={makeMain}
        >
          Make Main Storage Option
        </button>
      </Show>
      <div>
        <span>Type: {option?.storageType}</span>
      </div>
      <button
        id={option?.url}
        class="delete-button"
        title="click to delete"
        aria-label="click to delete"
        onClick={deleteOption}
      >
        x
      </button>
    </li >
  );
}

function NoElementMessage() {
  return (
    <li id="no-element">
      <h1 class="text-center">
        No Storage Option Available
      </h1>
    </li>
  );
}

async function fetchStorageOptions() {
  return (await getStorageOptions()).filter((option) => !option.deleted);
}

export function App(): JSX.Element {
  const [activeStorage, { refetch: refetchActiveStorage }] = createResource(getActiveStorage);
  const [storageOptions, { refetch, mutate }] = createResource(fetchStorageOptions);
  const [alias, setAlias] = createSignal<string>('');
  const [url, setUrl] = createSignal<string>('');
  const [selectedStorage, setSelectedStorage] = createSignal<string>('sia');

  createEffect(() => {
    console.log("alias", alias());
    console.log("url", url());
    console.log("selected", selectedStorage());
  });

  listenToStorage((changes) => {
    for (let [key, _] of Object.entries(changes)) {
      if (key == STORAGE_OPTIONS) {
        refetch()
      } else if (key == ACTIVE_STORAGE) {
        refetchActiveStorage();
        refetch()
      }
    }
  });

  async function submit(e: Event) {
    e.preventDefault()
    if (!alias()?.trim()) {
      console.log("alias empty");
      return
    }
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url() || "")
    } catch (err) {
      chrome.notifications.create("", {
        iconUrl: '../../../public/icon_128.png',
        type: 'basic',
        message: 'Invalid Url',
        title: 'Error',
      });
      console.log(err)
      return err;
    }
    chrome.notifications.create("", {
      iconUrl: '../../../public/icon_128.png',
      type: 'basic',
      message: 'Verifying Server Availability',
      title: 'Info',
    });
    const store: Storage = {
      url: parsedUrl.toString(),
      alias: alias()?.trim() || '',
      deleted: false,
      storageType: selectedStorage() || 'sia',
    }
    try {
      await ping(store);
    } catch (err) {
      chrome.notifications.create("", {
        iconUrl: '../../../public/icon_128.png',
        type: 'basic',
        message: 'Server Is Not Available',
        title: 'Error',
      });
      return
    }
    try {
      const storageTypeAvailable = await isStorageAvailable(store);
      if (storageTypeAvailable !== 'is available') {
        chrome.notifications.create("", {
          iconUrl: '../../../public/icon_128.png',
          type: 'basic',
          message: 'Storage Option Not Available',
          title: 'Error',
        });
        return
      }
    } catch (err) {
      chrome.notifications.create("", {
        iconUrl: '../../../public/icon_128.png',
        type: 'basic',
        message: 'Storage Option Not Available',
        title: 'Error',
      });
      return
    }
    const result = await createStorageOption(parsedUrl.toString(), alias()?.trim() || '', selectedStorage() || 'sia');
    setUrl('');
    setAlias('');
    console.log('result: ', result);
  }

  return (
    <>
      <h1 class="title">Storage Options</h1>
      <ul class="fullclick">
        <For
          each={storageOptions()}
          fallback={<NoElementMessage />}
        >
          {(option: Storage) => {
            const isActive = () => Boolean(
              option?.url === activeStorage()?.url &&
              option?.storageType == activeStorage()?.storageType &&
              Boolean(activeStorage()?.shouldSync)
            );
            return (
              <StorageElement
                option={option}
                setOptions={mutate}
                refetchActiveStorage={refetchActiveStorage}
                isActive={isActive}
                storageType={option.storageType || ''}
              />
            );
          }}
        </For>
      </ul>
      <form id="create-storage-option" onSubmit={submit}>
        <input
          type="text"
          name="alias"
          placeholder="alias"
          onChange={(e: Event) => {
            //@ts-ignore
            setAlias(e.target.value);
          }}
        />
        <input
          type="url"
          name="url"
          placeholder="url"
          onChange={(e: Event) => {
            //@ts-ignore
            setUrl(e.target.value);
          }}
        />
        <select
          onChange={(e: Event) => {
            //@ts-ignore
            setSelectedStorage(e.target.value);
          }}
        >
          <option selected value="sia">sia</option>
          <option value="filecoin">filecoin</option>
          <option value="fvm">fvm</option>
          <option value="fvmEncrypted">fvmEncrypted</option>
        </select>
        <button>create storage option</button>
      </form>
    </>
  );
}

render(App, document.getElementById("root")!);
