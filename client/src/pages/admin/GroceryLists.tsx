import GroceryListCard from "@/components/admin/grocery-lists/grocery-list-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdminGroceryLists } from "@/features/admin/grocery-lists/use-admin-grocery-lists";

const pageWrapClass = "space-y-6 p-6";
const cardClass = "border-border bg-card shadow-sm";
const cardHeaderClass = "space-y-4";
const cardTitleClass = "text-xl";
const searchInputClass = "max-w-sm";
const emptyStateClass = "py-10 text-center text-sm text-muted-foreground";
const listStackClass = "space-y-4";

function AdminGroceryLists() {
  const {
    search,
    setSearch,
    lists,
    loading,
    savingListId,
    getDraft,
    updateDraftPrice,
    getDraftTotal,
    savePrices,
    changeStatus,
  } = useAdminGroceryLists();

  return (
    <div className={pageWrapClass}>
      <Card className={cardClass}>
        <CardHeader className={cardHeaderClass}>
          <CardTitle className={cardTitleClass}>Grocery lists</CardTitle>
          <Input
            className={searchInputClass}
            placeholder="Search by code, customer or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className={emptyStateClass}>Loading lists…</p>
          ) : !lists.length ? (
            <p className={emptyStateClass}>No grocery lists yet.</p>
          ) : (
            <div className={listStackClass}>
              {lists.map((list) => (
                <GroceryListCard
                  key={list._id}
                  list={list}
                  draft={getDraft(list)}
                  draftTotal={getDraftTotal(list)}
                  saving={savingListId === list._id}
                  onPriceChange={(index, value) =>
                    updateDraftPrice(list, index, value)
                  }
                  onSavePrices={() => void savePrices(list)}
                  onChangeStatus={(status) =>
                    void changeStatus(list._id, status)
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminGroceryLists;
