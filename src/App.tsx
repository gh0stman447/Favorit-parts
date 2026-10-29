import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './app/store';
import { clearSearch, findBrands, findOffers } from './features/parts/partsSlice';
import type { Offer } from './features/parts/types';
import { PAGE_SIZE, SEARCH_DEBOUNCE_MS } from './constants/ui';
import './App.css';

const rubles = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 2,
});

function getPageItems(currentPage: number, pagesCount: number): Array<number | string> {
  const numbers = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, pagesCount])]
    .filter((item) => item > 0 && item <= pagesCount)
    .sort((left, right) => left - right);
  return numbers.flatMap((item, index) => {
    const previous = numbers[index - 1];
    return previous && item - previous > 1 ? [`dots-${item}`, item] : [item];
  });
}

function Loader({ text }: { text: string }) {
  return (
    <div
      className='d-flex justify-content-center align-items-center gap-2 my-4 text-secondary'
      role='status'
    >
      <span className='spinner-border spinner-border-sm text-danger' aria-hidden='true' />
      <span>{text}</span>
    </div>
  );
}

function Notice({ children, danger = false }: { children: React.ReactNode; danger?: boolean }) {
  return <div className={`alert ${danger ? 'alert-danger' : 'alert-light'} my-3`}>{children}</div>;
}

function OfferRow({ offer, index }: { offer: Offer; index: number }) {
  return (
    <tr key={`${offer.goodsID || offer.brand}-${offer.number}-${offer.warehouseId || index}`}>
      <td className='ps-4'>
        <strong className='d-block'>{offer.name || 'Без названия'}</strong>
        <span className='text-secondary small'>{offer.brand || 'Производитель не указан'}</span>
      </td>
      <td>{offer.number || '—'}</td>
      <td>{offer.warehouse || '—'}</td>
      <td className='fw-semibold text-nowrap'>
        {offer.price === null ? '—' : rubles.format(offer.price)}
      </td>
      <td
        className={`pe-4 fw-semibold text-nowrap ${offer.stock > 0 ? 'text-success' : 'text-danger'}`}
      >
        {offer.stock} шт.
      </td>
    </tr>
  );
}

function App() {
  const dispatch = useDispatch<AppDispatch>();

  const { brands, offers, status, error, selectedBrand, searchedNumber } = useSelector(
    (state: RootState) => state.parts,
  );

  const [number, setNumber] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const article = number.trim();

    if (!article) {
      dispatch(clearSearch());
      return undefined;
    }

    const timer = setTimeout(() => dispatch(findBrands(article)), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [number, dispatch]);

  const pagesCount = Math.ceil(offers.length / PAGE_SIZE);
  const currentPage = Math.min(page, pagesCount || 1);
  const visibleOffers = offers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageItems = getPageItems(currentPage, pagesCount);

  return (
    <main className='container py-5'>
      <header className='d-flex align-items-center gap-3 mb-4'>
        <div className='brand-mark'>FP</div>
        <div>
          <p className='text-danger text-uppercase fw-bold small mb-1'>Каталог автозапчастей</p>
          <h1 className='h2 mb-0'>Поиск деталей и аналогов</h1>
        </div>
      </header>
      <section className='card shadow-sm border-0 mb-3' aria-labelledby='search-title'>
        <div className='card-body p-4'>
          <h2 id='search-title' className='h5'>
            1. Введите артикул
          </h2>
          <p className='text-secondary small'>Сначала найдём доступных производителей.</p>
          <div className='position-relative'>
            <label className='visually-hidden' htmlFor='part-number'>
              Артикул детали
            </label>
            <input
              id='part-number'
              className='form-control form-control-lg'
              value={number}
              onChange={(event) => setNumber(event.target.value)}
              placeholder='Например, 7160500039S'
              autoComplete='off'
            />
            {status === 'brandsLoading' && (
              <span
                className='spinner-border spinner-border-sm text-danger input-spinner'
                aria-label='Поиск'
              />
            )}
          </div>
          <p className='form-text mb-0'>Поиск начнётся автоматически после ввода.</p>
        </div>
      </section>
      {error && <Notice danger>{error}</Notice>}
      {status === 'brandsLoading' && <Loader text='Ищем производителей…' />}
      {status === 'brandsSucceeded' && brands.length === 0 && (
        <Notice>По этому артикулу ничего не найдено. Проверьте номер детали.</Notice>
      )}
      {brands.length > 0 && (
        <section className='card shadow-sm border-0 mb-3' aria-labelledby='brands-title'>
          <div className='card-body p-4'>
            <h2 id='brands-title' className='h5'>
              2. Выберите производителя
            </h2>
            <p className='text-secondary small'>Найдено брендов: {brands.length}</p>
            <div className='d-flex flex-wrap gap-2'>
              {brands.map((brand) => (
                <button
                  className={`btn ${selectedBrand === brand ? 'btn-dark' : 'btn-outline-dark'}`}
                  key={brand}
                  type='button'
                  onClick={() => {
                    setPage(1);
                    dispatch(findOffers({ number: searchedNumber, brand }));
                  }}
                  disabled={status === 'offersLoading'}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
      {status === 'offersLoading' && (
        <Loader text={`Ищем предложения ${selectedBrand} и аналоги…`} />
      )}
      {status === 'offersSucceeded' && (
        <section className='card shadow-sm border-0' aria-labelledby='results-title'>
          <div className='card-header bg-white border-bottom d-flex align-items-center justify-content-between p-4'>
            <div>
              <p className='text-danger text-uppercase fw-bold small mb-1'>Результаты</p>
              <h2 id='results-title' className='h5 mb-0'>
                {selectedBrand}: предложения и аналоги
              </h2>
            </div>
            <span className='badge text-bg-secondary'>{offers.length} поз.</span>
          </div>
          {offers.length === 0 ? (
            <div className='card-body'>
              <Notice>По выбранному производителю предложений не найдено.</Notice>
            </div>
          ) : (
            <>
              <div className='table-responsive'>
                <table className='table table-hover align-middle mb-0'>
                  <thead className='table-light'>
                    <tr>
                      <th className='ps-4'>Наименование / производитель</th>
                      <th>Артикул</th>
                      <th>Склад</th>
                      <th>Цена</th>
                      <th className='pe-4'>Остаток</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleOffers.map((offer, index) => (
                      <OfferRow
                        offer={offer}
                        index={index}
                        key={`${offer.goodsID || offer.brand}-${offer.number}-${offer.warehouseId || index}`}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              {pagesCount > 1 && (
                <nav
                  className='pagination-nav d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 p-3 px-sm-4 border-top'
                  aria-label='Страницы результатов'
                >
                  <small className='text-secondary'>
                    Показаны {(currentPage - 1) * PAGE_SIZE + 1}-
                    {Math.min(currentPage * PAGE_SIZE, offers.length)} из {offers.length}
                  </small>
                  <ul className='pagination pagination-sm mb-0'>
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className='page-link'
                        type='button'
                        onClick={() => setPage(currentPage - 1)}
                        aria-label='Предыдущая страница'
                      >
                        ‹
                      </button>
                    </li>
                    {pageItems.map((item) =>
                      typeof item === 'string' ? (
                        <li className='page-item disabled' key={item}>
                          <span className='page-link'>…</span>
                        </li>
                      ) : (
                        <li
                          className={`page-item ${currentPage === item ? 'active' : ''}`}
                          key={item}
                        >
                          <button className='page-link' type='button' onClick={() => setPage(item)}>
                            {item}
                          </button>
                        </li>
                      ),
                    )}
                    <li className={`page-item ${currentPage === pagesCount ? 'disabled' : ''}`}>
                      <button
                        className='page-link'
                        type='button'
                        onClick={() => setPage(currentPage + 1)}
                        aria-label='Следующая страница'
                      >
                        ›
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </section>
      )}
    </main>
  );
}

export default App;
