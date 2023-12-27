import {
  Alert,
  FormControl,
  FormHelperText,
  InputAdornment,
  TextField,
} from "@mui/material";
import {
  CloudOfflineIcon,
  MarkGithubIcon,
  WorkflowIcon,
} from "@primer/octicons-react";
import classNames from "classnames";
import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { labelOptions } from "../../helper/gameHelper";
import { AppDispatch, RootState } from "../../slices";
import { setLocalServiceURL } from "../../slices/globalSlice";
import { toggleAFilter } from "../../slices/settingHelper";

interface CustomElements extends HTMLFormControlsCollection {
  source: HTMLInputElement;
}
interface CustomForm extends HTMLFormElement {
  elements: CustomElements;
}

interface ExternalSourceProps {
  onChangeInput: (valid: boolean) => void;
  onChangeTrust: (trust: boolean | null) => void;
}

export const ExternalSourceType = Object.freeze({
  Unset: 0,
  LocalService: 1,
  GitHubUserContent: 2,
});

function getUrl(gitHubUserName: string) {
  return `https://raw.githubusercontent.com/${gitHubUserName}/nmemonica-data/main`;
}

function getUserName(url: string) {
  return url.slice(
    url.indexOf(".com/") + 5,
    url.indexOf("/", url.indexOf(".com/") + 5)
  );
}

/** not a letter or a word */
const notALetterOrNumber = new RegExp(/^\W/);
/** valid port */
const hasAPort = new RegExp(/:\d{1,5}$/);

function validIP(userInput: string) {
  if (
    notALetterOrNumber.test(userInput) ||
    userInput.startsWith("http://") // http
  ) {
    return false;
  }
  // Number.isInteger(Number.parseInt(userInput.charAt(0)))
  // serviceUrl.toLowerCase().startsWith("https://") &&
  const valid =
    hasAPort.test(userInput) && userInput.length < 35 && userInput.length > 13;

  return valid;
}

function validGitHubUserContent(userName: string) {
  if (userName.length < 2) {
    return false;
  }
  // TODO: implement validGitHubUserContent
  return true;
}

export function getExternalSourceType(localServiceURL: string) {
  let type;
  if (localServiceURL.startsWith("https://raw.githubusercontent")) {
    type = ExternalSourceType.GitHubUserContent;
  } else if (localServiceURL !== "") {
    type = ExternalSourceType.LocalService;
  } else {
    type = ExternalSourceType.Unset;
  }
  return type;
}

export default function ExtSourceInput(props: ExternalSourceProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { localServiceURL } = useSelector(({ global }: RootState) => global);
  const [type, setType] = useState(() => {
    return getExternalSourceType(localServiceURL);
  });

  const [userInputError, setUserInputError] = useState(false);
  const [dataTrustAnswer, setDataTrustAnswer] = useState<null | boolean>(null);
  const { onChangeInput, onChangeTrust } = props;

  const checkExternalSourceCB = useCallback(
    (e: React.FormEvent<CustomForm>) => {
      e.preventDefault();
      e.stopPropagation();

      const form = e.currentTarget.elements;

      if (form && "source" in form) {
        const userInput = form.source.value;

        let result;
        switch (true) {
          case validIP(userInput):
            const scheme = userInput.startsWith("https://") ? "" : "https://";
            const lanAddress = scheme + userInput;
            result = dispatch(setLocalServiceURL(lanAddress)).unwrap();

            setType(ExternalSourceType.LocalService);
            break;

          case validGitHubUserContent(userInput):
            const gitHubUserName = userInput;
            const url = getUrl(gitHubUserName);
            // result doesn't contain anything useful
            void dispatch(setLocalServiceURL(url))
              .unwrap()
              .then(() => {
                setUserInputError(false);
                onChangeInput(false);
              })
              .catch(() => {
                setUserInputError(true);
                onChangeInput(false);
              });
            setType(ExternalSourceType.GitHubUserContent);
            break;

          case userInput === "":
            if (localServiceURL !== "") {
              result = dispatch(setLocalServiceURL("")).unwrap();

              setType(ExternalSourceType.Unset);
            }
            break;

          default:
            // let user know it's unavailable
            setUserInputError(true);
            onChangeInput(false);
        }

        result?.catch(() => {
          // let user know it's unavailable
          setUserInputError(true);
          onChangeInput(false);
        });
      }
    },
    [dispatch, localServiceURL, onChangeInput]
  );

  return (
    <form onSubmit={checkExternalSourceCB}>
      <div className="d-flex">
        <FormControl>
          <TextField
            id="source"
            error={userInputError}
            size="small"
            label={labelOptions(type, [
              "External source",
              "from Local Service (IP:PORT)",
              "from Github (username)",
            ])}
            variant="outlined"
            aria-label="Load user dataset"
            defaultValue={
              type === ExternalSourceType.GitHubUserContent
                ? getUserName(localServiceURL)
                : localServiceURL
            }
            onChange={() => {
              setDataTrustAnswer(null);
              onChangeTrust(null);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment
                  position="start"
                  onClick={() => {
                    const newType = toggleAFilter(type + 1, [
                      ExternalSourceType.Unset,
                      ExternalSourceType.LocalService,
                      ExternalSourceType.GitHubUserContent,
                    ]) as (typeof ExternalSourceType)[keyof typeof ExternalSourceType];

                    setType(newType);
                  }}
                >
                  {type === ExternalSourceType.Unset && (
                    <CloudOfflineIcon size="small" />
                  )}
                  {type === ExternalSourceType.LocalService && (
                    <WorkflowIcon size="small" />
                  )}
                  {type === ExternalSourceType.GitHubUserContent && (
                    <MarkGithubIcon size="small" />
                  )}
                </InputAdornment>
              ),
            }}
          />
          <FormHelperText>Import and overwrite local data !</FormHelperText>
        </FormControl>
      </div>

      {localServiceURL !== "" && (
        <Alert severity={!dataTrustAnswer ? "warning" : "success"}>
          <div>
            <span>Do you trust the owners of this external data source?</span>
          </div>
          <div className="d-flex w-100 justify-content-around">
            <span
              className={classNames({ underline: dataTrustAnswer })}
              onClick={() => {
                onChangeTrust(true);
                setDataTrustAnswer(true);
              }}
            >
              Yes
            </span>
            <span
              className={classNames({ underline: dataTrustAnswer === false })}
              onClick={() => {
                onChangeTrust(false);
                setLocalServiceURL("");
                setDataTrustAnswer(false);
              }}
            >
              No
            </span>
          </div>
        </Alert>
      )}
    </form>
  );
}
