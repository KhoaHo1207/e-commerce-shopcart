import CartIcon from "./cart-icon";
import Container from "./container";
import FavoriteButton from "./favorite-button";
import HeaderMenu from "./header-menu";
import Logo from "./logo";
import MobileMenu from "./mobile-menu";
import SearchBar from "./search-bar";
import SignIn from "./sign-in";

export default function Header() {
  return (
    <header className="border-b border-b-black/20 bg-white py-5">
      <Container className="text-light-color flex items-center justify-between">
        <div className="flex w-auto items-center justify-start gap-2.5 md:w-1/3 md:gap-0">
          <MobileMenu />
          <Logo />
        </div>
        <HeaderMenu />
        <div className="flex w-auto items-center justify-end gap-5 md:w-1/3">
          <SearchBar />
          <CartIcon />
          <FavoriteButton />
          <SignIn />
        </div>
      </Container>
    </header>
  );
}
