type UploadCommandParamsT = {
  folder: string;
  filename: string;
  mimetype: string;
  buffer: Buffer;
};

type DeleteCommandParamsT = {
  filename: string;
};

type GetUrlParamsT = {
  folder: string;
  filename: string;
};

export type { UploadCommandParamsT, DeleteCommandParamsT, GetUrlParamsT };
