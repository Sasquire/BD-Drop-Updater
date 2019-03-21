# BD-Drop-Updater

### [Install](https://raw.githubusercontent.com/Sasquire/BD-Drop-Updater/master/user.js)
You must have some user script manager. [Greasy Fork](https://greasyfork.org/en) has a good list. (I use tampermonkey)

This user script will create an alternative UI for Bad-Dragon's clearance page. This provides a semi-live viewing experience with seeing what toys have been taken, and which are still available. It also provides the ability to "wish list" something so that you will automatically try to add it to your cart.

This userscript isn't perfect. It's a miracle it actually works at all. Here are some of the limitations it has.
* It cannot add to cart products that don't have an image or use a stock photo
* It does not have a filter
* It doesn't look that great
* It does not give error messages when it breaks (please contact me if things are broken)
* It will not automatically update your cart (you have to reload the page to see the changes)
* When new toys are added your page will jump and it may lose your place
* It is very limited in how you can sort the toys
* It uses BD's internal naming scheme (Demogorgon is known as Jason)
* It uses an absurd amount of memory (I have seen it get close to 1GB of RAM)
* It requires a hard load to work (go to the clearance page and reload) 

Some notes about how to use it
* Toys that have a gray overlay are taken, and in someone else's cart or have been bought
* Toys that have a red background are flops.
* You can see the flop reason by hovering over the image.
* Toys with a gray outline use a stock photo and this script can not buy them.

I put this tool out in the hopes that people will use it responsibly. I do not think that this tool will work properly during big events such as the black friday sale. I recommend not using anything lower than 7s as your update frequency during times of action, and 30s during low times. (a low time would be the time right before a drop)

### FAQ

**Q: Will I get banned for doing this**
A: I have no idea. Probably not.

**Q: It crashed when I was doing X**
A: That's not a question, but please contact me with what was happening when it crashed.

**Q: How do I contact you?**
I would prefer initial contact through github.

**Q: Can I trust you?**
A: Hopefully with the restrictions and security from your user script manager you don't need to. 

**Q: Why does(n't) it do X**
A: Because I probably haven't thought of doing something else or doing it that way was simple.

**Q: Can you make it do X**
A: Probably. If you message me I might consider it.

**Q: Can *I* make it do X**
A: Please do. If you write a feature, I will probably accept it.

**Q: I really like this and want to buy you a coffee**
A: I don't like coffee, but I'll take a bottle of lube. Send me a message.
