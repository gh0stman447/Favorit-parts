import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { loadBrands, loadOffers } from './partsApi';
import type { ApiGood, Offer, PartsState } from './types';

const getMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Не удалось выполнить запрос. Проверьте подключение к сети.';

export const findBrands = createAsyncThunk<ApiGood[], string, { rejectValue: string }>(
  'parts/findBrands',
  async (number, { signal, rejectWithValue }) => {
    try {
      return await loadBrands(number, signal);
    } catch (error) {
      return rejectWithValue(getMessage(error));
    }
  },
);

export const findOffers = createAsyncThunk<ApiGood[], { number: string; brand: string }, { rejectValue: string }>(
  'parts/findOffers',
  async ({ number, brand }, { signal, rejectWithValue }) => {
    try {
      return await loadOffers(number, brand, signal);
    } catch (error) {
      return rejectWithValue(getMessage(error));
    }
  },
);

function flattenGoods(goods: ApiGood[]): Offer[] {
  const everyPart = goods.flatMap((good) => [good, ...(good.analogues ?? [])]);
  return everyPart.flatMap((part) => {
    const warehouses = part.warehouses?.length ? part.warehouses : [undefined];
    return warehouses.map((warehouse) => ({
      goodsID: part.goodsID,
      brand: part.brand,
      number: part.number,
      name: part.name,
      warehouse: warehouse?.code || warehouse?.id,
      warehouseId: warehouse?.id,
      price: warehouse?.price ?? null,
      stock: warehouse?.stock ?? part.count ?? 0,
    }));
  });
}

const initialState: PartsState = {
  brands: [],
  offers: [],
  searchedNumber: '',
  selectedBrand: '',
  status: 'idle',
  error: null,
};

const partsSlice = createSlice({
  name: 'parts',
  initialState,
  reducers: {
    clearSearch: (state) => {
      state.brands = [];
      state.offers = [];
      state.selectedBrand = '';
      state.searchedNumber = '';
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(findBrands.pending, (state, action) => {
        state.status = 'brandsLoading';
        state.error = null;
        state.searchedNumber = action.meta.arg;
        state.brands = [];
        state.offers = [];
        state.selectedBrand = '';
      })
      .addCase(findBrands.fulfilled, (state, action) => {
        if (action.meta.arg === state.searchedNumber) {
          state.status = 'brandsSucceeded';
          state.brands = [...new Set(action.payload.map((item) => item.brand).filter(Boolean))] as string[];
        }
      })
      .addCase(findBrands.rejected, (state, action) => {
        if (!action.meta.aborted && action.meta.arg === state.searchedNumber) {
          state.status = 'failed';
          state.error = action.payload ?? 'Поиск производителей не удался.';
        }
      })
      .addCase(findOffers.pending, (state, action) => {
        state.status = 'offersLoading';
        state.error = null;
        state.selectedBrand = action.meta.arg.brand;
      })
      .addCase(findOffers.fulfilled, (state, action) => {
        if (action.meta.arg.brand === state.selectedBrand) {
          state.status = 'offersSucceeded';
          state.offers = flattenGoods(action.payload);
        }
      })
      .addCase(findOffers.rejected, (state, action) => {
        if (!action.meta.aborted && action.meta.arg.brand === state.selectedBrand) {
          state.status = 'failed';
          state.error = action.payload ?? 'Поиск предложений не удался.';
        }
      }),
});

export const { clearSearch } = partsSlice.actions;
export default partsSlice.reducer;
